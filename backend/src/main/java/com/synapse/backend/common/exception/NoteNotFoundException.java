package com.synapse.backend.common.exception;

import java.util.UUID;

public class NoteNotFoundException extends RuntimeException {
    public NoteNotFoundException(UUID noteId) {
        super("노트를 찾을 수 없습니다: " + noteId);
    }
}
