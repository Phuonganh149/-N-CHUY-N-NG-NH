package com.cvmanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Result <T> {
    private final boolean success;
    private final T data;
    private final String message;

    public Result(boolean success, T data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    public static <T> Result<T> ok(T data) {
        return new Result<>(true,data,null);
    }
    public static <T> Result<T> ok(String message) {
        return new Result<>(true,null,message);
    }
    public static <T> Result<T> ok() {
        return new Result<>(true,null,null);
    }
    public static <T> Result<T> error(String message){
        return new Result<>(false,null,message);
    }

    public boolean getSuccess(){
        return this.success;
    }
    public T getData(){
        return this.data;
    }
    public String getMessage(){
        return this.message;
    }
}
