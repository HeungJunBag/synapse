package com.synapse.backend.domain.note.repository;

import com.synapse.backend.domain.note.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NoteRepository extends JpaRepository<Note, UUID> {

    // N+1 방지: 태그를 한 번의 쿼리로 함께 조회
    @Query("SELECT DISTINCT n FROM Note n " +
           "LEFT JOIN FETCH n.noteTags nt " +
           "LEFT JOIN FETCH nt.tag " +
           "WHERE n.member.id = :memberId")
    List<Note> findAllWithTagsByMemberId(@Param("memberId") UUID memberId);

    // 링크 동기화 시 제목으로 타겟 노트 탐색
    List<Note> findAllByMemberIdAndTitleIn(UUID memberId, List<String> titles);

    Optional<Note> findByIdAndMemberId(UUID id, UUID memberId);

    // 단건 조회 시 태그 함께 fetch (생성/수정 후 응답 반환용)
    @Query("SELECT n FROM Note n " +
           "LEFT JOIN FETCH n.noteTags nt " +
           "LEFT JOIN FETCH nt.tag " +
           "WHERE n.id = :noteId")
    Optional<Note> findWithTagsById(@Param("noteId") UUID noteId);
}
