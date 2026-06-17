package com.cvmanagement.services.CoreEntityService;

public interface CoreEntityServiceInterface<ObjectService, PrimaryKeyType, PostRequestClass, PatchRequestClass> {

    void create(PostRequestClass request) throws Exception;

    ObjectService read(PrimaryKeyType id) throws Exception;

    void update(PatchRequestClass request, PrimaryKeyType updateObjectId) throws Exception;

    void delete(PrimaryKeyType id) throws Exception;
}
