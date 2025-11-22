package kr.najoan.notionclone.entity

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "invite_links")
data class InviteLink(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    val workspace: Workspace,

    @Column(unique = true, nullable = false)
    val token: String = UUID.randomUUID().toString(),

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val role: WorkspaceRole = WorkspaceRole.MEMBER,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    val createdBy: User,

    @Column
    var expiresAt: LocalDateTime? = null,

    @Column(nullable = false)
    var isActive: Boolean = true,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column
    var maxUses: Int? = null,

    @Column(nullable = false)
    var usedCount: Int = 0
)
