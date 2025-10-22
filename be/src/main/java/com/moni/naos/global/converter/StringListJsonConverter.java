package com.moni.naos.global.converter;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.*;

@Converter
public class StringListJsonConverter implements AttributeConverter<List<String>, String> {
    private static final ObjectMapper om = new ObjectMapper();
    @Override public String convertToDatabaseColumn(List<String> attribute) {
        try { return om.writeValueAsString(attribute == null ? List.of() : attribute); }
        catch (Exception e) { throw new IllegalArgumentException(e); }
    }
    @Override public List<String> convertToEntityAttribute(String dbData) {
        try { return dbData == null ? List.of() : om.readValue(dbData, new TypeReference<List<String>>(){}); }
        catch (Exception e) { throw new IllegalArgumentException(e); }
    }
}
