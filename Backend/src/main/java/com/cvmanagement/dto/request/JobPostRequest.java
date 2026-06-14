package com.cvmanagement.dto.request;

import java.time.LocalDate;

public record JobPostRequest(
        String title,
        String company,
        String location,
        String salary,
        LocalDate deadline,
        Integer quantity,
        String tags
) {
}
