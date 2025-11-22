package kr.najoan.notionclone.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "workspaces")
data class Workspace(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    var name: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column
    var icon: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    val owner: User,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),

    @OneToMany(mappedBy = "workspace", cascade = [CascadeType.ALL], orphanRemoval = true)
    val members: MutableList<WorkspaceMember> = mutableListOf(),

    @OneToMany(mappedBy = "workspace", cascade = [CascadeType.ALL], orphanRemoval = true)
    val pages: MutableList<Page> = mutableListOf(),

    @OneToMany(mappedBy = "workspace", cascade = [CascadeType.ALL], orphanRemoval = true)
    val inviteLinks: MutableList<InviteLink> = mutableListOf()
)
