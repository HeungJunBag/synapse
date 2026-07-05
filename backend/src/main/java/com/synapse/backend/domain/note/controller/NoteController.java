package com.synapse.backend.domain.note.controller;

import com.synapse.backend.common.response.ApiResponse;
import com.synapse.backend.domain.note.dto.GraphResponse;
import com.synapse.backend.domain.note.dto.LinkResponse;
import com.synapse.backend.domain.note.dto.NoteRequest;
import com.synapse.backend.domain.note.dto.NoteResponse;
import com.synapse.backend.domain.note.service.NoteService;
import com.synapse.backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    // GET /api/notes — 내 노트 전체 목록
    @GetMapping
    public ResponseEntity<ApiResponse<List<NoteResponse>>> getNotes(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<NoteResponse> notes = noteService.getNotes(userDetails.getMemberId());
        return ResponseEntity.ok(ApiResponse.ok(notes));
    }

    // GET /api/notes/{id} — 단건 조회
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NoteResponse>> getNote(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        NoteResponse note = noteService.getNote(id, userDetails.getMemberId());
        return ResponseEntity.ok(ApiResponse.ok(note));
    }

    // POST /api/notes — 노트 생성
    @PostMapping
    public ResponseEntity<ApiResponse<NoteResponse>> createNote(
            @Valid @RequestBody NoteRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        NoteResponse note = noteService.createNote(request, userDetails.getMemberId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(note));
    }

    // PUT /api/notes/{id} — 노트 수정
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<NoteResponse>> updateNote(
            @PathVariable UUID id,
            @Valid @RequestBody NoteRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        NoteResponse note = noteService.updateNote(id, request, userDetails.getMemberId());
        return ResponseEntity.ok(ApiResponse.ok(note));
    }

    // DELETE /api/notes/{id} — 노트 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNote(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        noteService.deleteNote(id, userDetails.getMemberId());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // GET /api/notes/{id}/links — 아웃고잉 링크 + 백링크
    @GetMapping("/{id}/links")
    public ResponseEntity<ApiResponse<LinkResponse>> getLinks(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        LinkResponse links = noteService.getLinks(id, userDetails.getMemberId());
        return ResponseEntity.ok(ApiResponse.ok(links));
    }

    // GET /api/notes/graph — 그래프 뷰용 전체 노드·엣지
    @GetMapping("/graph")
    public ResponseEntity<ApiResponse<GraphResponse>> getGraphData(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        GraphResponse graph = noteService.getGraphData(userDetails.getMemberId());
        return ResponseEntity.ok(ApiResponse.ok(graph));
    }
}
