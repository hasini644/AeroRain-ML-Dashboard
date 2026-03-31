import pandas as pd

# Load dataset (UPDATED FILE NAME)
df = pd.read_csv("rainfall.csv")

# Fix column names (remove spaces)
df.columns = df.columns.str.strip()

# Convert rainfall (target) from yes/no → 1/0
df['rainfall'] = df['rainfall'].map({'yes': 1, 'no': 0})

# Drop unnecessary column
if 'day' in df.columns:
    df = df.drop('day', axis=1)

# Remove missing values
df = df.dropna()

# Show cleaned data
print("Cleaned Data:\n")
print(df.head())

# Show dataset info
print("\nDataset Info:\n")
print(df.info())

# ===============================
# MACHINE LEARNING STARTS HERE
# ===============================

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Features (X) and Target (y)
X = df.drop('rainfall', axis=1)
y = df['rainfall']

# Split data (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Create model
model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    class_weight='balanced'
)

# Train model
model.fit(X_train, y_train)

# Predict
y_pred = model.predict(X_test)

# Evaluate
print("\nModel Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n", classification_report(y_test, y_pred))

import pickle

with open("rain_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("\nModel saved successfully as rain_model.pkl")