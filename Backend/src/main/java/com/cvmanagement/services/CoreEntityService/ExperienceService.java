package com.cvmanagement.services.CoreEntityService;

import com.cvmanagement.dto.request.Experience.ExperiencePatchRequest;
import com.cvmanagement.dto.request.Experience.ExperiencePostRequest;
import com.cvmanagement.entities.Experience;
import com.cvmanagement.repositories.ExperienceRepo;

public class ExperienceService implements CoreEntityServiceInterface<Experience, Integer, ExperiencePostRequest, ExperiencePatchRequest> {
    private final ExperienceRepo experienceRepo;

    public ExperienceService(ExperienceRepo experienceRepo) {
        this.experienceRepo = experienceRepo;
    }

    @Override
    public void create(ExperiencePostRequest request) throws Exception {
//        experienceRepo.create(new Experience());
    }

    @Override
    public Experience read(Integer id) throws Exception {
        return experienceRepo.read(id);
    }

    @Override
    public void update(ExperiencePatchRequest request, Integer updateObjectId) throws Exception {

    }

    @Override
    public void delete(Integer id) throws Exception {

    }
}
