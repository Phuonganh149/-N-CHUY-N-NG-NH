package com.cvmanagement.dto.response;

import com.cvmanagement.entities.Account;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse {
    private String token;
    private final String display_code;
    private final String full_name;
    private final String bio;
    private final String address;
    private final String email;
    private final String phone;
    private final String role;

    public LoginResponse(String token, Account logInAccount) {
        this.token = token;
        this.display_code = logInAccount.getDisplayCode();
        this.full_name = logInAccount.getFullName();
        this.bio = logInAccount.getBio();
        this.address = logInAccount.getAddress();
        this.email = logInAccount.getEmail();
        this.phone = logInAccount.getPhone();
        this.role = logInAccount.getRole().toString();
    }

    public String getToken() {
        // Chỉ được lấy một lần để thêm vào header sau đó gán giá trị null để Spring không trả về accesstoken
        if (this.token == null) {
            return null;
        }

        String savedToken =
                "Bearer " + this.token;

        this.token = null;

        return savedToken;
    }

    public String getDisplay_code() {
        return display_code;
    }

    public String getFull_name() {
        return full_name;
    }

    public String getBio() {
        return bio;
    }

    public String getAddress() {
        return address;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getRole() {
        return role;
    }
}
