package com.cvmanagement.exceptions;

public class BusinessException extends RuntimeException {
    public BusinessException(String error) {
        super(error);
    }
}
