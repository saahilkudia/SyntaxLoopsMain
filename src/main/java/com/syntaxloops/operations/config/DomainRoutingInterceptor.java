package com.syntaxloops.operations.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class DomainRoutingInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String host = request.getHeader("Host");
        String uri = request.getRequestURI();

        // Enforce strict separation when requests hit api.syntaxloops.com
        if (host != null && host.contains("api.syntaxloops.com")) {
            // Block UI root requests, html views, and static assets
            if (uri.equals("/") || uri.endsWith(".html") || uri.startsWith("/js/") || uri.startsWith("/css/")) {
                response.setContentType("application/json");
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                response.getWriter().write("{\"status\": 404, \"message\": \"SyntaxLoops API Gateway: Valid API endpoint required.\"}");
                return false;
            }
        }
        return true;
    }
}