package com.classlink.server.service;

import java.security.SecureRandom;
import org.springframework.stereotype.Service;

@Service
public class TemporaryPasswordService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijkmnopqrstuvwxyz";
    private static final String DIGITS = "23456789";
    private static final String SYMBOLS = "@#$%!?";
    private static final int PASSWORD_LENGTH = 10;
    private static final String POOL = UPPER + LOWER + DIGITS + SYMBOLS;

    public String generate() {
        StringBuilder sb = new StringBuilder(PASSWORD_LENGTH);
        // ensure at least one of each category
        sb.append(randomChar(UPPER));
        sb.append(randomChar(LOWER));
        sb.append(randomChar(DIGITS));
        sb.append(randomChar(SYMBOLS));
        while (sb.length() < PASSWORD_LENGTH) {
            sb.append(randomChar(POOL));
        }
        return shuffle(sb.toString());
    }

    private char randomChar(String source) {
        return source.charAt(RANDOM.nextInt(source.length()));
    }

    private String shuffle(String input) {
        char[] chars = input.toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = RANDOM.nextInt(i + 1);
            char tmp = chars[i];
            chars[i] = chars[j];
            chars[j] = tmp;
        }
        return new String(chars);
    }
}
