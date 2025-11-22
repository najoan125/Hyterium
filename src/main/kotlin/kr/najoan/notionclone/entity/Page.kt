package kr.najoan.notionclone.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "pages")
data class Page(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    var title: String,

    @Column
    var icon: String? = null,

    @Column
    var coverImage: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    val workspace: Workspace,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_page_id")
    var parentPage: Page? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    val createdBy: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_edited_by", nullable = false)
    var lastEditedBy: User,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    var isDeleted: Boolean = false,

    @Column(nullable = false)
    var sortOrder: Int = 0,

    @OneToMany(mappedBy = "parentPage", cascade = [CascadeType.ALL])
    val childPages: MutableList<Page> = mutableListOf(),

    @OneToMany(mappedBy = "page", cascade = [CascadeType.ALL], orphanRemoval = true)
    val blocks: MutableList<Block> = mutableListOf()
)
