package kr.najoan.notionclone.repository

import kr.najoan.notionclone.entity.InviteLink
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface InviteLinkRepository : JpaRepository<InviteLink, Long> {
    fun findByToken(token: String): Optional<InviteLink>
    fun findAllByWorkspaceIdAndIsActive(workspaceId: Long, isActive: Boolean = true): List<InviteLink>
}
