package kr.najoan.notionclone.entity

import jakarta.persistence.*
import java.time.LocalDateTime

enum class WorkspaceRole {
    OWNER,
    ADMIN,
    MEMBER,
    GUEST
}

@Entity
@Table(
    name = "workspace_members",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["workspace_id", "user_id"])
    ]
)
data class WorkspaceMember(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    val workspace: Workspace,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var role: WorkspaceRole = WorkspaceRole.MEMBER,

    @Column(nullable = false)
    val joinedAt: LocalDateTime = LocalDateTime.now()
)
