package kr.najoan.notionclone.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "users")
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(unique = true, nullable = false)
    val discordId: String,

    @Column(nullable = false)
    val username: String,

    @Column(unique = true, nullable = false)
    val email: String,

    @Column
    val avatarUrl: String? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now(),

    @OneToMany(mappedBy = "user", cascade = [CascadeType.ALL], orphanRemoval = true)
    val workspaceMembers: MutableList<WorkspaceMember> = mutableListOf()
)
