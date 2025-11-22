package kr.najoan.notionclone.controller

import kr.najoan.notionclone.dto.CreateWorkspaceRequest
import kr.najoan.notionclone.dto.UpdateWorkspaceRequest
import kr.najoan.notionclone.dto.WorkspaceDto
import kr.najoan.notionclone.security.UserPrincipal
import kr.najoan.notionclone.service.WorkspaceService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/workspaces")
class WorkspaceController(
    private val workspaceService: WorkspaceService
) {

    @PostMapping
    fun createWorkspace(
        @AuthenticationPrincipal userPrincipal: UserPrincipal,
        @RequestBody request: CreateWorkspaceRequest
    ): ResponseEntity<WorkspaceDto> {
        val workspace = workspaceService.createWorkspace(userPrincipal.user, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(workspace)
    }

    @GetMapping
    fun getAllWorkspaces(
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<List<WorkspaceDto>> {
        val workspaces = workspaceService.getAllWorkspaces(userPrincipal.user.id!!)
        return ResponseEntity.ok(workspaces)
    }

    @GetMapping("/{workspaceId}")
    fun getWorkspace(
        @PathVariable workspaceId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<WorkspaceDto> {
        val workspace = workspaceService.getWorkspaceById(workspaceId, userPrincipal.user.id!!)
        return ResponseEntity.ok(workspace)
    }

    @PutMapping("/{workspaceId}")
    fun updateWorkspace(
        @PathVariable workspaceId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal,
        @RequestBody request: UpdateWorkspaceRequest
    ): ResponseEntity<WorkspaceDto> {
        val workspace = workspaceService.updateWorkspace(workspaceId, userPrincipal.user.id!!, request)
        return ResponseEntity.ok(workspace)
    }

    @DeleteMapping("/{workspaceId}")
    fun deleteWorkspace(
        @PathVariable workspaceId: Long,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ResponseEntity<Void> {
        workspaceService.deleteWorkspace(workspaceId, userPrincipal.user.id!!)
        return ResponseEntity.noContent().build()
    }
}
