package com.tzme.cms.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record HomeGlobalSettings(
        @NotNull Boolean enabled,
        @NotNull @Valid Text kicker,
        @NotNull @Valid Text titleLine1,
        @NotNull @Valid Text titleLine2,
        @NotNull @Valid Text description,
        @NotBlank @Size(max = 500) String image,
        @Pattern(regexp = "points|image") String mapMode,
        @Size(max = 100) List<@NotNull @Valid MapPoint> mapPoints,
        @NotNull @Valid Text imageAlt,
        @NotNull @Size(min = 3, max = 3) List<@NotNull @Valid Statistic> statistics,
        @NotNull Boolean showButton,
        @NotNull @Valid Text buttonText,
        @NotBlank @Size(max = 500) String buttonLink) {

    public record Text(
            @NotNull @Size(max = 1000) String en,
            @NotNull @Size(max = 1000) String zh) {}

    public record Statistic(
            @NotBlank @Size(max = 24) String value,
            @NotNull @Size(max = 16) String suffix,
            @NotNull @Valid Text label) {}

    public record MapPoint(
            @NotBlank @Pattern(regexp = "[a-zA-Z0-9_-]{1,80}") String id,
            @NotNull @Valid Text label,
            @NotNull @DecimalMin("0") @DecimalMax("100") Double x,
            @NotNull @DecimalMin("0") @DecimalMax("100") Double y) {}

    // Records saved before the point map update retain their copy and uploaded images.
    public HomeGlobalSettings withMapDefaults() {
        String mode = mapMode != null ? mapMode : "/assets/worldmap.png".equals(image) ? "points" : "image";
        return new HomeGlobalSettings(enabled, kicker, titleLine1, titleLine2, description,
                image, mode, mapPoints != null ? mapPoints : List.of(), imageAlt, statistics,
                showButton, buttonText, buttonLink);
    }
}
