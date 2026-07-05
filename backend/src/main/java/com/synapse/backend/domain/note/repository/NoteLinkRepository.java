package com.synapse.backend.domain.note.repository;

import com.synapse.backend.domain.note.entity.NoteLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NoteLinkRepository extends JpaRepository<NoteLink, UUID> {

    @Query("SELECT nl FROM NoteLink nl JOIN FETCH nl.targetNote WHERE nl.sourceNote.id = :noteId")
    List<NoteLink> findOutgoingWithTarget(@Param("noteId") UUID noteId);

    @Query("SELECT nl FROM NoteLink nl JOIN FETCH nl.sourceNote WHERE nl.targetNote.id = :noteId")
    List<NoteLink> findBacklinksWithSource(@Param("noteId") UUID noteId);

    @Query("SELECT nl FROM NoteLink nl JOIN FETCH nl.sourceNote JOIN FETCH nl.targetNote WHERE nl.sourceNote.member.id = :memberId")
    List<NoteLink> findAllByMemberId(@Param("memberId") UUID memberId);

    @Modifying
    @Query("DELETE FROM NoteLink nl WHERE nl.sourceNote.id = :sourceNoteId")
    void deleteAllBySourceNoteId(@Param("sourceNoteId") UUID sourceNoteId);
}
