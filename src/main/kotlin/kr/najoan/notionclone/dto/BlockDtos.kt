package kr.najoan.notionclone.dto

// BlockNote 에디터의 블록 구조와 일치하는 DTO
data class BlockUpdateRequest(
    val id: String, // BlockNote 에디터가 생성하는 고유 문자열 ID
    val type: String,
    val content: String?,
    val properties: String?,
    val position: Int
)

// API 응답용 DTO
data class BlockDto(
    val id: Long, // 데이터베이스의 고유 ID (PK)
    val clientId: String, // BlockNote 에디터의 고유 ID
    val type: String,
    val content: String?,
    val properties: String?,
    val position: Int,
    val parentBlockId: Long?,
    val createdAt: String,
    val updatedAt: String,
)

// 단일 블록 생성용 DTO (기존)
data class CreateBlockRequest(
    val type: String,
    var content: String?,
    var properties: String?,
    var position: Int,
    val parentBlockId: Long? = null,
)

// 단일 블록 수정용 DTO (기존)
data class UpdateBlockRequest(
    val type: String?,
    var content: String?,
    var properties: String?,
    var position: Int?,
)
