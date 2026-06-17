package com.cvmanagement.repositories;

import com.cvmanagement.entities.Subscription;

import java.util.Set;

public class SubscriptionRepo implements CrudRepoInterface<Subscription, String> {

    @Override
    public void create(Subscription object) throws Exception {

    }

    @Override
    public Subscription read(String id) throws Exception {
        return null;
    }

    @Override
    public void update(String id, Subscription object, Set<String> modifyField) throws Exception {

    }

    @Override
    public void delete(String id) throws Exception {

    }
}
