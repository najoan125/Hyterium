package kr.najoan.notionclone.dto

import kr.najoan.notionclone.entity.WorkspaceRole

data class LoginResponse(
    val token: String,
    val user: UserDto
)

data class UserDto(
    val id: Long,
    val discordId: String,
    val username: String,
    val email: String,
    val avatarUrl: String?
)

data class WorkspaceDto(
    val id: Long,
    val name: String,
    val description: String?,
    val icon: String?,
    val role: WorkspaceRole,
    val memberCount: Int,
    val createdAt: String,
    val updatedAt: String
)

data class CreateWorkspaceRequest(
    val name: String,
    val description: String? = null,
    val icon: String? = null
)

data class UpdateWorkspaceRequest(
    val name: String?,
    val description: String?,
    val icon: String?
)

data class PageDto(
    val id: Long,
    val title: String,
    val icon: String?,
    val coverImage: String?,
    val workspaceId: Long,
    val parentPageId: Long?,
    val createdBy: UserDto,
    val createdAt: String,
    val updatedAt: String,
    val childPages: List<PageDto>?
)

data class CreatePageRequest(
    val title: String,
    val icon: String? = null,
    val coverImage: String? = null,
    val parentPageId: Long? = null
)

data class UpdatePageRequest(
    val title: String?,
    val icon: String?,
    val coverImage: String?
)

data class BlockDto(
    val id: Long,
    val type: String,
    val content: String?,
    val properties: String?,
    val position: Int,
    val parentBlockId: Long?,
    val createdAt: String,
    val updatedAt: String
)

data class CreateBlockRequest(
    val type: String,
    val content: String?,
    val properties: String?,
    val position: Int,
    val parentBlockId: Long? = null
)

data class UpdateBlockRequest(
    val type: String?,
    val content: String?,
    val properties: String?,
    val position: Int?
)

data class WorkspaceMemberDto(
    val id: Long,
    val user: UserDto,
    val role: WorkspaceRole,
    val joinedAt: String
)

data class UpdateMemberRoleRequest(
    val role: WorkspaceRole
)

data class InviteLinkDto(
    val id: Long,
    val token: String,
    val role: WorkspaceRole,
    val expiresAt: String?,
    val isActive: Boolean,
    val maxUses: Int?,
    val usedCount: Int,
    val createdAt: String
)

data class CreateInviteLinkRequest(
    val role: WorkspaceRole = WorkspaceRole.MEMBER,
    val expiresInDays: Int? = null,
    val maxUses: Int? = null
)
