package kr.najoan.notionclone.service

import kr.najoan.notionclone.dto.UserDto
import kr.najoan.notionclone.entity.User
import kr.najoan.notionclone.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class UserService(
    private val userRepository: UserRepository
) {

    fun getUserById(userId: Long): User {
        return userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found with id: $userId") }
    }

    fun getUserByDiscordId(discordId: String): User? {
        return userRepository.findByDiscordId(discordId).orElse(null)
    }

    fun createOrUpdateUser(
        discordId: String,
        username: String,
        email: String,
        avatarUrl: String?
    ): User {
        val existingUser = getUserByDiscordId(discordId)

        return if (existingUser != null) {
            val updatedUser = existingUser.copy(
                username = username,
                email = email,
                avatarUrl = avatarUrl,
                updatedAt = LocalDateTime.now()
            )
            userRepository.save(updatedUser)
        } else {
            val newUser = User(
                discordId = discordId,
                username = username,
                email = email,
                avatarUrl = avatarUrl
            )
            userRepository.save(newUser)
        }
    }

    fun toDto(user: User): UserDto {
        return UserDto(
            id = user.id!!,
            discordId = user.discordId,
            username = user.username,
            email = user.email,
            avatarUrl = user.avatarUrl
        )
    }
}
