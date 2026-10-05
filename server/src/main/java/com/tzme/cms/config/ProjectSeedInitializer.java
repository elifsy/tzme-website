package com.tzme.cms.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tzme.cms.model.Project;
import com.tzme.cms.repository.ProjectRepository;
import java.io.InputStream;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ProjectSeedInitializer implements ApplicationRunner {
    private final ProjectRepository repository;
    private final ObjectMapper mapper;

    public ProjectSeedInitializer(ProjectRepository repository, ObjectMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        try (InputStream stream = new ClassPathResource("projects-seed.json").getInputStream()) {
            List<Project> initial = mapper.readValue(stream, new TypeReference<List<Project>>() {});
            for (Project project : initial) {
                if (!repository.existsById(project.getId())) repository.save(project);
            }
        }
    }
}
