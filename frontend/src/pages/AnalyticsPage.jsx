import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  axios.get('http://127.0.0.1:8000/analytics')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading Analytics...</h2>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Analytics Not Available</h2>
        <p>Please ensure the backend server is running on port 8000.</p>
      </div>
    );
  }

  // Extract data for charts
  const brands = Object.entries(data.top_brands || {}).slice(0, 10);
  const materials = Object.entries(data.materials || {}).slice(0, 10);
  const colors = Object.entries(data.colors || {}).slice(0, 10);
  const categories = Object.entries(data.categories || {});

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '30px', color: '#333' }}>
        📊 Dataset Analytics
      </h1>

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>Total Products</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>
            {data.total_products}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>Avg Price</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>
            ${data.price_stats?.avg?.toFixed(0) || 'N/A'}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>Price Range</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '20px', fontWeight: 'bold' }}>
            ${data.price_stats?.min?.toFixed(0)} - ${data.price_stats?.max?.toFixed(0)}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>Categories</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>
            {categories.length}
          </p>
        </div>
      </div>

      {/* Data Health */}
      {data.dataset_health && (
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ marginTop: 0, fontSize: '24px', color: '#333' }}>Dataset Health</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            {Object.entries(data.dataset_health).map(([key, value]) => (
              <div key={key} style={{ textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>{key}</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#333' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        
        {/* Top Brands */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ marginTop: 0, fontSize: '20px', color: '#333' }}>🏷️ Top 10 Brands</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {brands.map(([brand, count], idx) => (
              <div key={brand} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                marginBottom: '8px',
                background: idx % 2 === 0 ? '#f8f9fa' : 'white',
                borderRadius: '6px'
              }}>
                <span style={{ fontWeight: 500, color: '#333' }}>{brand}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: `${(count / brands[0][1]) * 100}px`,
                    height: '8px',
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '4px'
                  }} />
                  <span style={{ fontWeight: 'bold', color: '#667eea', minWidth: '40px', textAlign: 'right' }}>
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Materials */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ marginTop: 0, fontSize: '20px', color: '#333' }}>🪵 Top 10 Materials</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {materials.map(([material, count], idx) => (
              <div key={material} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                marginBottom: '8px',
                background: idx % 2 === 0 ? '#f8f9fa' : 'white',
                borderRadius: '6px'
              }}>
                <span style={{ fontWeight: 500, color: '#333' }}>{material}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: `${(count / materials[0][1]) * 100}px`,
                    height: '8px',
                    background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
                    borderRadius: '4px'
                  }} />
                  <span style={{ fontWeight: 'bold', color: '#f5576c', minWidth: '40px', textAlign: 'right' }}>
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Colors */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ marginTop: 0, fontSize: '20px', color: '#333' }}>🎨 Top 10 Colors</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {colors.map(([color, count], idx) => (
              <div key={color} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                marginBottom: '8px',
                background: idx % 2 === 0 ? '#f8f9fa' : 'white',
                borderRadius: '6px'
              }}>
                <span style={{ fontWeight: 500, color: '#333' }}>{color}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: `${(count / colors[0][1]) * 100}px`,
                    height: '8px',
                    background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                    borderRadius: '4px'
                  }} />
                  <span style={{ fontWeight: 'bold', color: '#00f2fe', minWidth: '40px', textAlign: 'right' }}>
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ marginTop: 0, fontSize: '20px', color: '#333' }}>📦 Product Categories</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {categories.map(([category, count], idx) => (
              <div key={category} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                marginBottom: '8px',
                background: idx % 2 === 0 ? '#f8f9fa' : 'white',
                borderRadius: '6px'
              }}>
                <span style={{ fontWeight: 500, color: '#333' }}>{category}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: `${(count / categories[0][1]) * 100}px`,
                    height: '8px',
                    background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                    borderRadius: '4px'
                  }} />
                  <span style={{ fontWeight: 'bold', color: '#43e97b', minWidth: '40px', textAlign: 'right' }}>
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Price Distribution */}
      {data.price_stats && (
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          marginTop: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ marginTop: 0, fontSize: '20px', color: '#333' }}>💰 Price Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
            <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Average</p>
              <p style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#667eea' }}>
                ${data.price_stats.avg.toFixed(2)}
              </p>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Median</p>
              <p style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#f5576c' }}>
                ${data.price_stats.median.toFixed(2)}
              </p>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Minimum</p>
              <p style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#4facfe' }}>
                ${data.price_stats.min.toFixed(2)}
              </p>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Maximum</p>
              <p style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#43e97b' }}>
                ${data.price_stats.max.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}