package kr.najoan.notionclone.security

import kr.najoan.notionclone.service.UserService
import org.slf4j.LoggerFactory
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.messaging.support.MessageHeaderAccessor
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

@Component
class WebSocketAuthInterceptor(
    private val jwtUtils: JwtUtils,
    private val userService: UserService
) : ChannelInterceptor {

    private val logger = LoggerFactory.getLogger(WebSocketAuthInterceptor::class.java)

    override fun preSend(message: Message<*>, channel: MessageChannel): Message<*>? {
        val accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor::class.java)

        if (accessor != null && StompCommand.CONNECT == accessor.command) {
            val authHeader = accessor.getFirstNativeHeader("Authorization")

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                val token = authHeader.substring(7)

                try {
                    if (jwtUtils.validateToken(token)) {
                        val userId = jwtUtils.getUserIdFromToken(token)
                        val user = userService.getUserById(userId)
                        val userPrincipal = UserPrincipal(user)

                        val authentication = UsernamePasswordAuthenticationToken(
                            userPrincipal,
                            null,
                            userPrincipal.authorities
                        )

                        SecurityContextHolder.getContext().authentication = authentication
                        accessor.user = authentication
                    }
                } catch (e: Exception) {
                    logger.error("WebSocket JWT validation failed: ${e.message}", e)
                }
            }
        }

        return message
    }
}
