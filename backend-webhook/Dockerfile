# Gunakan image Node.js
FROM node:18

# Set working directory di dalam container
WORKDIR /app

# Copy file package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install nodemon secara global
RUN npm install -g nodemon

# Copy seluruh kode aplikasi
COPY . .

# Expose port yang digunakan aplikasi (sesuai dengan Express)
EXPOSE 3001

# Jalankan aplikasi dengan nodemon
CMD ["npm", "run", "dev"]
