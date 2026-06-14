/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 */

package com.cvmanagement;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 *
 * @author Hendrix_Klaris
 */
@SpringBootApplication
public class Program {
    private static final Logger log = LoggerFactory.getLogger(Program.class);

    public static void main(String[] args) {
        SpringApplication.run(Program.class, args);
        log.error("Khởi động thành công");
    }
}
