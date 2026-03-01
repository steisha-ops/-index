#!/bin/bash

# 🔨 iOS Build Script - Полная сборка приложения для iOS
# Этот скрипт автоматизирует весь процесс компиляции для iOS

set -e  # Выход при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  📱 iOS Build Script - Индекс Облав v6${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Проверка зависимостей
echo -e "${YELLOW}[1/5]${NC} Проверка зависимостей..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js не установлен${NC}"
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm не установлен${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js и npm найдены${NC}"

# Установка зависимостей npm
echo -e "${YELLOW}[2/5]${NC} Установка npm зависимостей..."
npm install --legacy-peer-deps
echo -e "${GREEN}✓ npm зависимости установлены${NC}"

# Сборка веб-версии
echo -e "${YELLOW}[3/5]${NC} Сборка веб-версии (vite build)..."
npm run build
echo -e "${GREEN}✓ Веб-версия собрана в dist/${NC}"

# Синхронизация с iOS через Capacitor
echo -e "${YELLOW}[4/5]${NC} Синхронизация с iOS (capacitor sync)..."
npx cap sync ios
echo -e "${GREEN}✓ Файлы синхронизированы в iOS проект${NC}"

# Установка Pod зависимостей
echo -e "${YELLOW}[5/5]${NC} Установка CocoaPods зависимостей..."
cd ios/App
if [ ! -f "Podfile.lock" ]; then
    echo "Первая установка pods (может занять время)..."
fi
pod install
cd ../..
echo -e "${GREEN}✓ CocoaPods зависимости установлены${NC}"

# Успех
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Сборка завершена успешно!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📖 Следующие шаги:${NC}"
echo ""
echo -e "  1️⃣  Откройте XCode:"
echo -e "     ${YELLOW}open ios/App/App.xcworkspace${NC}"
echo ""
echo -e "  2️⃣  В XCode выберите целевое устройство:"
echo -e "     • iPhone симулятор (например iPhone 15 Pro)"
echo -e "     • Или реальное устройство (если подключено)"
echo ""
echo -e "  3️⃣  Нажмите Run (▶️) или Cmd+R для компиляции"
echo ""
echo -e "  4️⃣  Убедитесь что выбран ${YELLOW}App.xcworkspace${NC} (не .xcodeproj)"
echo ""
echo -e "${BLUE}⚙️  Важные файлы для конфигурации:${NC}"
echo -e "  • Signing: Project → App → Signing & Capabilities"
echo -e "  • Версия: Project → App → General → Version"
echo -e "  • БанделID: ${YELLOW}com.example.app${NC} (измени на свой)"
echo ""
echo -e "${BLUE}🔗 Ссылки:${NC}"
echo -e "  📄 Инструкция: ${YELLOW}iOS_BUILD_INSTRUCTIONS.md${NC}"
echo -e "  ⚙️  Конфиг Capacitor: ${YELLOW}capacitor.config.json${NC}"
echo ""
