package com.cvmanagement.utilities;

import com.cvmanagement.dto.dto;
import com.cvmanagement.dto.request.CandidatePatchRequest;
import com.cvmanagement.exceptions.BusinessException;

import java.lang.reflect.Field;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class Validator<T> {
    public static void isUsernameValid(String username) {
        // Username hợp lệ là khi đáp ứng các đk:
        // - Không empty, blank
        // - Không chứa khoảng trắng
        // - Không bắt đầu bằng số
        // - Không ngắn hơn 3 ký tự và không dài hơn 20 ký tự
        // - Không chứa khoảng trống
        // - Không chứa ký tự đặc biệt
        // - Không chứa chữ hoa
        if (Character.isDigit(username.charAt(0))) throw new BusinessException(("username không hợp lệ"));
        if (username.isBlank()) throw new BusinessException("username không được để trống");
        if (username.length() < 3) throw new BusinessException("username quá ngắn");
        if (username.length() > 20) throw new BusinessException("username quá dài");
        if (username.contains(" ")) throw new BusinessException("username không được chứa khoảng trắng");
        for (char elem : username.toCharArray()) {
            if (Character.isUpperCase(elem))
                throw new BusinessException("username không được chứa ký tự viết hoa");
            if (!Character.isLetterOrDigit(elem))
                throw new BusinessException("username không được chứa ký tự đặc biệt");
        }
    }

    public static void isPasswordValid(String password) {
        // Password hợp lệ:
        // - Không empty, blank
        // - Không chứa khoảng trắng
        // - Không ngắn hơn 8 ký tự
        // - Có ký tự đặc biệt
        // - Có uppercase, lowercase letter
        // - Có digit
        if (password.isBlank())
            throw new BusinessException("password không được để trống");
        if (password.length() < 8) throw new BusinessException("password quá ngắn");
        if (password.contains(" ")) throw new BusinessException("password không được chứa khoảng trắng");
        boolean hasSpecial = false;
        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        for (char elem : password.toCharArray()) {
            if (Character.isLetter(elem)) {
                if (Character.isUpperCase(elem)) hasUpper = true;
                if (Character.isLowerCase(elem)) hasLower = true;
            }
            if (Character.isDigit(elem)) hasDigit = true;
            if (!Character.isLetterOrDigit(elem)) hasSpecial = true;
        }
        if (!hasSpecial) throw new BusinessException("password phải có ít nhất 1 ký tự đặc biệt");
        if (!hasUpper) throw new BusinessException("password phải có ít nhất 1 chữ viết hoa");
        if (!hasLower) throw new BusinessException("password phải có ít nhất 1 chữ thường");
        if (!hasDigit) throw new BusinessException("password phải có ít nhất 1 số");
    }

    public static void isPhonenumberValid(String phonenumber) {
        // Số điện thoại hợp lệ:
        // - Không blank, empty
        // - Chính xác 10 hoặc 11 ký tự
        // - Chỉ có số
        // - Bắt đầu bằng 03, 05, 07, 08, 09 (Đầu số Việt Nam)
        if (phonenumber.isBlank()) throw new BusinessException("Số điện thoại không được để trống");
        if (phonenumber.length() != 10 && phonenumber.length() != 11)
            throw new BusinessException("Số ký tự trong SDT không hợp lệ");
        for (char n : phonenumber.toCharArray()) {
            if (!Character.isDigit(n))
                throw new BusinessException("SDT không được chứa chữ hoặc ký tự đặc biệt");
        }
        if (
                !phonenumber.startsWith("03")
                        || !phonenumber.startsWith("05")
                        || !phonenumber.startsWith("07")
                        || !phonenumber.startsWith("08")
                        || !phonenumber.startsWith("09")
        ) throw new BusinessException("Số điện thoại không hợp lệ");
    }

    public static void isEmailValid(String email) {
        // Không được null hoặc blank
        if (email == null || email.isBlank()) {
            throw new BusinessException("Email không hợp lệ");
        }

        /*
         * Rule:
         * - Local part chỉ cho phép chữ, số và một số ký tự phổ biến
         * - Phải có đúng 1 ký tự @
         * - Domain phải có dấu chấm
         * - Không cho phép khoảng trắng
         * - Không cho phép domain bắt đầu/kết thúc bằng dấu chấm
         * - TLD tối thiểu 2 ký tự
         */
        String EMAIL_REGEX =
                "^[A-Za-z0-9._%+-]+@" +
                        "[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*" +
                        "\\.[A-Za-z]{2,}$";

        Pattern EMAIL_PATTERN = Pattern.compile(EMAIL_REGEX);

        // Kiểm tra email có match regex hay không
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new BusinessException("Email không hợp lệ");
        }
    }

    public static void isRequestBodyValid(Map<String, Object> requestBody, dto input) throws BusinessException {
        Set<String> validFields = Arrays.stream(CandidatePatchRequest.class.getDeclaredFields()).map(Field::getName).collect(Collectors.toSet());
        String[] inputField = requestBody.keySet().stream().filter(elem -> !validFields.contains(elem)).toArray(String[]::new);
        if (inputField.length != 0) {
            StringJoiner result = new StringJoiner(", ");
            for (String elem : inputField) {
                result.add(elem);
            }
            throw new BusinessException("Request field không hợp lệ: " + result.toString());

        }
    }

    public static void isCompanyNameValid(String companyName) throws BusinessException {
        // Tên công ty hợp lệ
        // - Không blank hoặc empty
        // - Không ký tự đặc biệt
        // - Không có số
        // - Chiều dài tối thiểu 3
        if (companyName.isEmpty()) throw new BusinessException("tên công ty không được để trống");
        if (companyName.length() < 3) throw new BusinessException("tên công ty quá ngắn");
        for (char elem : companyName.toCharArray())
            if (!Character.isAlphabetic(elem))
                if (Character.isDigit(elem)) throw new BusinessException("tên công ty không nên chứa số");
                else throw new BusinessException("tên công ty không được chứa ký tự đặc biệt");
    }

    public static void isJobTitleValid(String title) throws BusinessException {
        // Tên job hợp lệ:
        // - Không blank
        // - Tối thiểu 10 ký tự
        // - Không ký tự đặc biệt
        if (title.length() < 10) throw new BusinessException("Tiêu đề tin quá ngắn");
        if (title.isBlank()) throw new BusinessException("Tiêu đề tin không được để trống");
        for (char elem : title.toCharArray())
            if (!Character.isAlphabetic(elem))
                throw new BusinessException("tên công ty không được chứa ký tự đặc biệt");
    }

    public static void isSkillNameValid(String skillName) throws BusinessException {
        skillName = skillName.trim();
        Pattern SKILL_PATTERN = Pattern.compile("^[A-Za-z0-9+#./ -]+$");
        // Empty
        if (skillName.isEmpty()) {
            throw new BusinessException("tên kỹ năng không được để trống");
        }
        // Length
        if (skillName.length() < 2) {
            throw new BusinessException("tên kỹ năng không được ngắn hơn " + 2 + " ký tự");
        }
        if (skillName.length() > 20) {
            throw new BusinessException("tên kỹ năng không được dài quá " + 20 + " ký tự");
        }
        // Multiple spaces
        if (skillName.contains("  ")) {
            throw new BusinessException("tên kỹ năng không được chứa khoảng trắng liên tiếp");
        }
        // Allowed characters
        if (!SKILL_PATTERN.matcher(skillName).matches()) {
            throw new BusinessException("tên kỹ năng chứa ký tự không hợp lệ");
        }
        // Must contain at least one letter or number
        if (!skillName.matches(".*[A-Za-z0-9].*")) {
            throw new BusinessException("tên kỹ năng có tối thiểu một số hoặc một chữ");
        }
        // Không cho bắt đầu/kết thúc bằng special char
        if (!Character.isLetterOrDigit(skillName.charAt(0))) {
            throw new BusinessException("tên kỹ năng không được bắt đầu bằng ký tự đặc biệt");
        }
        if (!Character.isLetterOrDigit(skillName.charAt(skillName.length() - 1))) {
            throw new BusinessException("tên kỹ năng không được kết thúc bằng ký tự đặc biệt");
        }
    }

    public static void isUserIdValid(String input) throws BusinessException {
        try {
            UUID.fromString(input);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("userId không hợp lệ");
        }
//
//        HashMap<Character, Integer> list = new HashMap<>();
//
//        for (Character i : input.toCharArray()) {
//            if (i.toString().matches("-")) continue;
//            if (list.containsKey(i)) {
//                Integer oldVal = list.get(i);
//                if (oldVal >= 3) throw new BusinessException("userId không hợp lệ");
//                list.replace(i, oldVal, oldVal + 1);
//            } else {
//                list.put(i, 1);
//            }
//        }
    }
}

