<?php
/**
 * Генерация и валидация промокодов
 */

/**
 * Генерирует новый промокод из 5 цифр
 */
function generatePromoCode(): string {
    return str_pad((string)rand(10000, 99999), 5, '0', STR_PAD_LEFT);
}

/**
 * Валидирует промокод (должен быть 5 цифр)
 */
function validatePromoCode(string $code): bool {
    return preg_match('/^\d{5}$/', $code) === 1;
}

