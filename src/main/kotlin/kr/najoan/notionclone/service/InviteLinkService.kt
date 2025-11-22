package kr.najoan.notionclone.service

import kr.najoan.notionclone.dto.CreateInviteLinkRequest
import kr.najoan.notionclone.dto.InviteLinkDto
import kr.najoan.notionclone.dto.WorkspaceDto
import kr.najoan.notionclone.entity.InviteLink
import kr.najoan.notionclone.entity.User
import kr.najoan.notionclone.entity.WorkspaceMember
import kr.najoan.notionclone.entity.WorkspaceRole
import kr.najoan.notionclone.repository.InviteLinkRepository
import kr.najoan.notionclone.repository.WorkspaceMemberRepository
import kr.najoan.notionclone.repository.WorkspaceRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class InviteLinkService(
    private val inviteLinkRepository: InviteLinkRepository,
    private val workspaceRepository: WorkspaceRepository,
    private val workspaceMemberRepository: WorkspaceMemberRepository,
    private val workspaceService: WorkspaceService,
    @Value("\${base.url}")
    private val baseUrl: String
) {

    fun createInviteLink(
        workspaceId: Long,
        user: User,
        request: CreateInviteLinkRequest
    ): InviteLinkDto {
        val member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, user.id!!)
            .orElseThrow { IllegalArgumentException("You are not a member of this workspace") }

        if (member.role != WorkspaceRole.OWNER && member.role != WorkspaceRole.ADMIN) {
            throw kr.najoan.notionclone.exception.AccessDeniedException("You don't have permission to create invite links")
        }

        val workspace = workspaceRepository.findById(workspaceId)
            .orElseThrow { IllegalArgumentException("Workspace not found") }

        val expiresAt = request.expiresInDays?.let {
            LocalDateTime.now().plusDays(it.toLong())
        }

        val inviteLink = InviteLink(
            workspace = workspace,
            role = request.role,
            createdBy = user,
            expiresAt = expiresAt,
            maxUses = request.maxUses
        )

        val savedLink = inviteLinkRepository.save(inviteLink)
        return toDto(savedLink)
    }

    fun getWorkspaceInviteLinks(workspaceId: Long, userId: Long): List<InviteLinkDto> {
        val member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
            .orElseThrow { IllegalArgumentException("You are not a member of this workspace") }

        if (member.role != WorkspaceRole.OWNER && member.role != WorkspaceRole.ADMIN) {
            throw IllegalArgumentException("You don't have permission to view invite links")
        }

        val inviteLinks = inviteLinkRepository.findAllByWorkspaceIdAndIsActive(workspaceId)
        return inviteLinks.map { toDto(it) }
    }

    fun acceptInvite(token: String, user: User): WorkspaceDto {
        val inviteLink = inviteLinkRepository.findByToken(token)
            .orElseThrow { IllegalArgumentException("Invalid invite link") }

        if (!inviteLink.isActive) {
            throw IllegalArgumentException("This invite link is no longer active")
        }

        if (inviteLink.expiresAt != null && inviteLink.expiresAt!! < LocalDateTime.now()) {
            inviteLink.isActive = false
            inviteLinkRepository.save(inviteLink)
            throw IllegalArgumentException("This invite link has expired")
        }

        if (inviteLink.maxUses != null && inviteLink.usedCount >= inviteLink.maxUses!!) {
            inviteLink.isActive = false
            inviteLinkRepository.save(inviteLink)
            throw IllegalArgumentException("This invite link has reached its maximum uses")
        }

        val existingMember = workspaceMemberRepository.findByWorkspaceIdAndUserId(
            inviteLink.workspace.id!!,
            user.id!!
        )

        if (existingMember.isPresent) {
            throw IllegalArgumentException("You are already a member of this workspace")
        }

        val member = WorkspaceMember(
            workspace = inviteLink.workspace,
            user = user,
            role = inviteLink.role
        )
        workspaceMemberRepository.save(member)

        inviteLink.usedCount++
        inviteLinkRepository.save(inviteLink)

        val memberCount = workspaceMemberRepository.findAllByWorkspaceId(inviteLink.workspace.id!!).size

        return workspaceService.getWorkspaceById(inviteLink.workspace.id!!, user.id!!)
    }

    fun deactivateInviteLink(linkId: Long, workspaceId: Long, userId: Long) {
        val member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
            .orElseThrow { IllegalArgumentException("You are not a member of this workspace") }

        if (member.role != WorkspaceRole.OWNER && member.role != WorkspaceRole.ADMIN) {
            throw IllegalArgumentException("You don't have permission to deactivate invite links")
        }

        val inviteLink = inviteLinkRepository.findById(linkId)
            .orElseThrow { IllegalArgumentException("Invite link not found") }

        if (inviteLink.workspace.id != workspaceId) {
            throw IllegalArgumentException("Invite link does not belong to this workspace")
        }

        inviteLink.isActive = false
        inviteLinkRepository.save(inviteLink)
    }

    private fun toDto(inviteLink: InviteLink): InviteLinkDto {
        return InviteLinkDto(
            id = inviteLink.id!!,
            token = inviteLink.token,
            url = "$baseUrl/invite/${inviteLink.token}",
            role = inviteLink.role,
            expiresAt = inviteLink.expiresAt?.toString(),
            isActive = inviteLink.isActive,
            maxUses = inviteLink.maxUses,
            usedCount = inviteLink.usedCount,
            createdAt = inviteLink.createdAt.toString()
        )
    }
}
