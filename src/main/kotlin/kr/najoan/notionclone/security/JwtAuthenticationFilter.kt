package kr.najoan.notionclone.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import kr.najoan.notionclone.service.UserService
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthenticationFilter(
    private val jwtUtils: JwtUtils,
    private val userService: UserService
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            val jwt = getJwtFromRequest(request)
            logger.info("Processing request to: ${request.requestURI}")
            logger.info("Authorization header present: ${request.getHeader("Authorization") != null}")

            if (jwt != null) {
                logger.info("JWT token found, validating...")
                if (jwtUtils.validateToken(jwt)) {
                    logger.info("JWT token is valid")
                    val userId = jwtUtils.getUserIdFromToken(jwt)
                    logger.info("User ID from token: $userId")
                    val user = userService.getUserById(userId)
                    logger.info("User found: ${user.email}")

                    val userPrincipal = UserPrincipal(user)
                    val authentication = UsernamePasswordAuthenticationToken(
                        userPrincipal,
                        null,
                        userPrincipal.authorities
                    )
                    authentication.details = WebAuthenticationDetailsSource().buildDetails(request)

                    SecurityContextHolder.getContext().authentication = authentication
                    logger.info("Authentication set successfully")
                } else {
                    logger.warn("JWT token validation failed")
                }
            } else {
                logger.warn("No JWT token found in request")
            }
        } catch (e: Exception) {
            logger.error("Could not set user authentication in security context", e)
        }

        filterChain.doFilter(request, response)
    }

    private fun getJwtFromRequest(request: HttpServletRequest): String? {
        val bearerToken = request.getHeader("Authorization")
        return if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            bearerToken.substring(7)
        } else null
    }
}
