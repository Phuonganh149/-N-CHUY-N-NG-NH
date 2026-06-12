package com.cvmanagement.dto;

public class SupabaseLoginResponse {
    public String access_token;
    public user user;

    public String getAccess_token() {
        return access_token;
    }

    public void setAccess_token(String access_token) {
        this.access_token = access_token;
    }

    public user getUser() {
        return user;
    }

    public void setUser(user user) {
        this.user = user;
    }
}

