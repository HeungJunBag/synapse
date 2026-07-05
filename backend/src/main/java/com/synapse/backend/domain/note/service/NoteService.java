package com.synapse.backend.domain.note.service;

import com.synapse.backend.common.exception.NoteNotFoundException;
import com.synapse.backend.domain.member.entity.Member;
import com.synapse.backend.domain.member.repository.MemberRepository;
import com.synapse.backend.domain.note.dto.GraphResponse;
import com.synapse.backend.domain.note.dto.LinkResponse;
import com.synapse.backend.domain.note.dto.NoteRequest;
import com.synapse.backend.domain.note.dto.NoteResponse;
import com.synapse.backend.domain.note.entity.*;
import com.synapse.backend.domain.note.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class NoteService {

    private static final Pattern WIKI_LINK_PATTERN = Pattern.compile("\\[\\[(.+?)\\]\\]");

    private final NoteRepository noteRepository;
    private final NoteLinkRepository noteLinkRepository;
    private final TagRepository tagRepository;
    private final NoteTagRepository noteTagRepository;
    private final MemberRepository memberRepository;

    @PersistenceContext
    private EntityManager entityManager;

    // ─── 목록 조회 ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<NoteResponse> getNotes(UUID memberId) {
        return noteRepository.findAllWithTagsByMemberId(memberId).stream()
                .map(NoteResponse::from)
                .toList();
    }

    // ─── 단건 조회 ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public NoteResponse getNote(UUID noteId, UUID memberId) {
        Note note = findOwnedNote(noteId, memberId);
        return NoteResponse.from(note);
    }

    // ─── 생성 ───────────────────────────────────────────────────────────────────

    @Transactional
    public NoteResponse createNote(NoteRequest request, UUID memberId) {
        Member member = memberRepository.getReferenceById(memberId);
        Note note = Note.create(member, request.title(), request.content());
        noteRepository.save(note);

        syncLinks(note, memberId);
        syncTags(note, request.tags(), member);

        // flush 후 1차 캐시 제거 → DB에서 태그 포함 재조회
        noteRepository.flush();
        entityManager.clear();
        return noteRepository.findWithTagsById(note.getId())
                .map(NoteResponse::from)
                .orElse(NoteResponse.from(note));
    }

    // ─── 수정 ───────────────────────────────────────────────────────────────────

    @Transactional
    public NoteResponse updateNote(UUID noteId, NoteRequest request, UUID memberId) {
        Note note = findOwnedNote(noteId, memberId);
        note.update(request.title(), request.content());

        // 링크·태그 delete-then-insert 동기화
        noteLinkRepository.deleteAllBySourceNoteId(noteId);
        noteTagRepository.deleteAllByNoteId(noteId);

        syncLinks(note, memberId);
        syncTags(note, request.tags(), note.getMember());

        noteRepository.flush();
        return noteRepository.findWithTagsById(noteId)
                .map(NoteResponse::from)
                .orElse(NoteResponse.from(note));
    }

    // ─── 삭제 ───────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteNote(UUID noteId, UUID memberId) {
        Note note = findOwnedNote(noteId, memberId);
        noteRepository.delete(note);
    }

    // ─── 링크 조회 (아웃고잉 + 백링크) ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public LinkResponse getLinks(UUID noteId, UUID memberId) {
        findOwnedNote(noteId, memberId); // 소유권 검증

        List<LinkResponse.NoteRef> outgoing = noteLinkRepository
                .findOutgoingWithTarget(noteId).stream()
                .map(nl -> new LinkResponse.NoteRef(nl.getTargetNote().getId(), nl.getTargetNote().getTitle()))
                .toList();

        List<LinkResponse.NoteRef> backlinks = noteLinkRepository
                .findBacklinksWithSource(noteId).stream()
                .map(nl -> new LinkResponse.NoteRef(nl.getSourceNote().getId(), nl.getSourceNote().getTitle()))
                .toList();

        return new LinkResponse(outgoing, backlinks);
    }

    // ─── 그래프 뷰 데이터 ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public GraphResponse getGraphData(UUID memberId) {
        List<GraphResponse.Node> nodes = noteRepository.findAllWithTagsByMemberId(memberId).stream()
                .map(n -> new GraphResponse.Node(n.getId(), n.getTitle()))
                .toList();

        List<GraphResponse.Link> links = noteLinkRepository.findAllByMemberId(memberId).stream()
                .map(nl -> new GraphResponse.Link(nl.getSourceNote().getId(), nl.getTargetNote().getId()))
                .toList();

        return new GraphResponse(nodes, links);
    }

    // ─── 내부 헬퍼 ──────────────────────────────────────────────────────────────

    private Note findOwnedNote(UUID noteId, UUID memberId) {
        return noteRepository.findByIdAndMemberId(noteId, memberId)
                .orElseThrow(() -> new NoteNotFoundException(noteId));
    }

    /**
     * [[title]] 파싱 → 같은 멤버의 노트 중 제목 일치하는 것을 찾아 NoteLink 생성.
     * delete-then-insert 전략으로 호출 전 기존 링크 삭제 필요.
     */
    private void syncLinks(Note sourceNote, UUID memberId) {
        List<String> linkedTitles = parseWikiLinks(sourceNote.getContent());
        if (linkedTitles.isEmpty()) return;

        List<Note> targetNotes = noteRepository.findAllByMemberIdAndTitleIn(memberId, linkedTitles);
        List<NoteLink> links = targetNotes.stream()
                .filter(target -> !target.getId().equals(sourceNote.getId())) // 자기 자신 제외
                .map(target -> NoteLink.of(sourceNote, target))
                .toList();

        noteLinkRepository.saveAll(links);
    }

    /**
     * 태그 upsert 후 NoteTag 연결.
     * delete-then-insert 전략으로 호출 전 기존 NoteTag 삭제 필요.
     */
    private void syncTags(Note note, List<String> tagNames, Member member) {
        if (tagNames == null || tagNames.isEmpty()) return;

        List<NoteTag> noteTags = tagNames.stream()
                .filter(StringUtils::hasText)
                .map(name -> {
                    Tag tag = tagRepository.findByMemberIdAndName(member.getId(), name)
                            .orElseGet(() -> tagRepository.save(Tag.create(member, name)));
                    return NoteTag.of(note, tag);
                })
                .toList();

        noteTagRepository.saveAll(noteTags);
    }

    private List<String> parseWikiLinks(String content) {
        if (!StringUtils.hasText(content)) return List.of();
        Matcher matcher = WIKI_LINK_PATTERN.matcher(content);
        List<String> titles = new java.util.ArrayList<>();
        while (matcher.find()) {
            titles.add(matcher.group(1).trim());
        }
        return titles;
    }
}
