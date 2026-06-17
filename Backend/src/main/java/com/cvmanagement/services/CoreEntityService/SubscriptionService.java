package com.cvmanagement.services.CoreEntityService;

import com.cvmanagement.dto.request.Subscription.SubscriptionPatchRequest;
import com.cvmanagement.dto.request.Subscription.SubscriptionPostRequest;
import com.cvmanagement.entities.Subscription;
import org.springframework.stereotype.Service;

@Service
public class SubscriptionService implements CoreEntityServiceInterface<Subscription, String, SubscriptionPostRequest, SubscriptionPatchRequest> {
    @Override
    public void create(SubscriptionPostRequest request) throws Exception {

    }

    @Override
    public Subscription read(String id) throws Exception {
        return null;
    }

    @Override
    public void update(SubscriptionPatchRequest request, String updateObjectId) throws Exception {

    }

    @Override
    public void delete(String id) throws Exception {

    }
}
