package com.classlink.server.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve files saved under ./uploads/profile as /static/profile/**
        registry.addResourceHandler("/static/profile/**")
            .addResourceLocations("file:uploads/profile/");

        // Serve requirements PDFs for admin review
        registry.addResourceHandler("/static/requirements/**")
            .addResourceLocations("file:uploads/requirements/");
    }
}
