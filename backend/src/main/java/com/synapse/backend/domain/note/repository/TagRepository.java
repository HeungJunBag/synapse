package com.synapse.backend.domain.note.repository;

import com.synapse.backend.domain.note.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TagRepository extends JpaRepository<Tag, UUID> {
    List<Tag> findAllByMemberId(UUID memberId);
    Optional<Tag> findByMemberIdAndName(UUID memberId, String name);
}
