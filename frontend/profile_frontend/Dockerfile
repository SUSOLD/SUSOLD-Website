FROM node:18-alpine

WORKDIR /app

# Paket dosyalarını kopyalayıp bağımlılıkları yüklüyoruz
COPY package*.json ./

# Temel paketleri legacy-peer-deps bayrağıyla yükleyelim
RUN npm install --legacy-peer-deps

# Eksik paketleri legacy-peer-deps bayrağıyla yükleyelim
RUN npm install --legacy-peer-deps react-router-dom react-slick slick-carousel recharts

# Tüm frontend kodlarını kopyalıyoruz
COPY . .

# Dev server'ı 5173 portunda çalıştırıyoruz
EXPOSE 5173

# Geliştirme sunucusunu başlatıyoruz
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]