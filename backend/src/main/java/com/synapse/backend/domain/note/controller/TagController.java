package com.synapse.backend.domain.note.controller;

import com.synapse.backend.common.response.ApiResponse;
import com.synapse.backend.domain.note.repository.TagRepository;
import com.synapse.backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagRepository tagRepository;

    // GET /api/tags — 내 태그 목록 조회
    @GetMapping
    public ResponseEntity<ApiResponse<List<String>>> getTags(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<String> tags = tagRepository.findAllByMemberId(userDetails.getMemberId()).stream()
                .map(tag -> tag.getName())
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(tags));
    }
}
