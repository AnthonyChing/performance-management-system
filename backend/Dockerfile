# Use an official Python runtime as a parent image
# "slim" variants are smaller and generally sufficient for Django
FROM python:3.14-slim

# Set environment variables
# Prevents Python from writing pyc files to disc
ENV PYTHONDONTWRITEBYTECODE=1
# Prevents Python from buffering stdout and stderr (faster logging)
ENV PYTHONUNBUFFERED=1

# Set the working directory inside the container
WORKDIR /app

# Copy the entrypoint first since it is small and less likely to change, allowing better use of Docker cache
COPY --chmod=0755 entrypoint.sh .

# Copy only requirements first to leverage Docker cache
COPY requirements.txt .
# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Finally, copy the rest of the application code
COPY . .

# Expose port 8000 for the Django development server
EXPOSE 8000

# Set the entrypoint
ENTRYPOINT ["/bin/bash", "/app/entrypoint.sh"]
