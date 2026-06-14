package com.cvmanagement.utilities;

import com.cvmanagement.enums.AccountRole;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

import java.util.StringJoiner;
import java.util.concurrent.ThreadLocalRandom;


public class DisplayIDGenerator {
    // Cách ID hiển thị được tạo:
    // Prefix tương ứng với role + ngày tháng năm tài khoản tạo + 5 ký tự base64
    public static String generateID(AccountRole role){
        StringJoiner newDisplayID = new StringJoiner("-");
        String prefix = "";
        switch(role){
            case Candidate -> prefix="CA";
            case HR -> prefix="RE";
            case Admin -> prefix="AD";
            case null, default -> prefix="UN";
        }
        newDisplayID.add(prefix);
        newDisplayID.add(LocalDateTime.now().format(DateTimeFormatter.ofPattern("ddMMyy")));
        String randCode = "";
        do{
            byte[] bytes = new byte[4];
            ThreadLocalRandom.current().nextBytes(bytes);
            randCode = Base64.getEncoder()
                    .withoutPadding()
                    .encodeToString(bytes);
        }while (randCode.contains("-"));

        newDisplayID.add(randCode);

        return newDisplayID.toString();
    }

    // Generate pre-view DisplayIDs
//    public static void main(String[] args) {
//        for (int i = 0;i<2;i++){
//            System.out.println(generateID(AccountRole.Candidate));
//        }
//        for (int i = 0;i<2;i++){
//            System.out.println(generateID(AccountRole.Admin));
//        }
//        for (int i = 0;i<2;i++){
//            System.out.println(generateID(AccountRole.HR));
//        }
//    }
}
