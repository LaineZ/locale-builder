cmake_minimum_required(VERSION 3.15)
project(locale_builder)

set(CMAKE_CXX_STANDARD 17)

# ---- SCITER PATH ----
set(SCITER_DIR ${CMAKE_SOURCE_DIR}/sciter)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

include_directories(${SCITER_DIR}/include)

add_executable(locale_builder
    src/main.cpp
    ${SCITER_DIR}/include/sciter-x.h
    ${SCITER_DIR}/include/sciter-x-window.hpp
    ${SCITER_DIR}/include/sciter-main.cpp
)

add_custom_target(run
    COMMAND ${CMAKE_COMMAND} -E copy_directory
        "${CMAKE_SOURCE_DIR}/res"
        "${CMAKE_CURRENT_BINARY_DIR}/res"
    COMMAND locale_builder
    DEPENDS locale_builder
    WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
)

add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
        "${CMAKE_SOURCE_DIR}/res"
        "$<TARGET_FILE_DIR:${PROJECT_NAME}>/res"
)

# ---- PLATFORM ----
if(WIN32)
    target_link_libraries(locale_builder user32 gdi32)

    add_custom_command(TARGET locale_builder POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        ${SCITER_DIR}/bin/windows/x64/sciter.dll
        $<TARGET_FILE_DIR:locale_builder>
    )

elseif(UNIX AND NOT APPLE)
    target_link_libraries(locale_builder dl pthread)

    add_custom_command(TARGET locale_builder POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        ${SCITER_DIR}/bin/linux/x64/libsciter.so
        $<TARGET_FILE_DIR:locale_builder>
    )

elseif(APPLE)
    target_link_libraries(locale_builder "-framework Cocoa")

    add_custom_command(TARGET locale_builder POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        ${SCITER_DIR}/bin/macos/libsciter.dylib
        $<TARGET_FILE_DIR:locale_builder>
    )
endif()