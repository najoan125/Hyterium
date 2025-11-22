package kr.najoan.notionclone.controller

import kr.najoan.notionclone.dto.CreateInviteLinkRequest
import kr.najoan.notionclone.dto.InviteLinkDto
import kr.najoan.notionclone.dto.WorkspaceDto
import kr.najoan.notionclone.security.UserPrincipal
import kr.najoan.notionclone.service.InviteLinkService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/invites")
class InviteLinkController(
    private val inviteLinkService: InviteLinkService
) {

    @PostMapping
    fun createInviteLink(
        @PathVariable workspaceId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal,
        @RequestBody request: CreateInviteLinkRequest
    ): ResponseEntity<InviteLinkDto> {
        val inviteLink = inviteLinkService.createInviteLink(workspaceId, userPrincipal.user, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(inviteLink)
    }

    @GetMapping
    fun getWorkspaceInviteLinks(
        @PathVariable workspaceId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<List<InviteLinkDto>> {
        val inviteLinks = inviteLinkService.getWorkspaceInviteLinks(workspaceId, userPrincipal.user.id!!)
        return ResponseEntity.ok(inviteLinks)
    }

    @PostMapping("/{linkId}/deactivate")
    fun deactivateInviteLink(
        @PathVariable workspaceId: Long,
        @PathVariable linkId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<Void> {
        inviteLinkService.deactivateInviteLink(linkId, workspaceId, userPrincipal.user.id!!)
        return ResponseEntity.noContent().build()
    }
}

@RestController
@RequestMapping("/api/invites")
class PublicInviteLinkController(
    private val inviteLinkService: InviteLinkService
) {

    @PostMapping("/{token}/accept")
    fun acceptInvite(
        @PathVariable token: String,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<WorkspaceDto> {
        val workspace = inviteLinkService.acceptInvite(token, userPrincipal.user)
        return ResponseEntity.ok(workspace)
    }
}
