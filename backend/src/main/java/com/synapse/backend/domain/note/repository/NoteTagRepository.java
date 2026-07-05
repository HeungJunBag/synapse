package com.synapse.backend.domain.note.repository;

import com.synapse.backend.domain.note.entity.NoteTag;
import com.synapse.backend.domain.note.entity.NoteTagId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface NoteTagRepository extends JpaRepository<NoteTag, NoteTagId> {

    @Modifying
    @Query("DELETE FROM NoteTag nt WHERE nt.note.id = :noteId")
    void deleteAllByNoteId(@Param("noteId") UUID noteId);
}
