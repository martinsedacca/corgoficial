import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { generateStatisticsReport } from '../utils/reportGenerator';
import { DateRangePicker } from './DateRangePicker';
import { BarChart3, Calendar, User, Activity, TrendingUp, FileText, Filter, Download, CheckCircle } from 'lucide-react';

// Componente Skeleton para las tarjetas
const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 bg-gray-200 rounded"></div>
      <div>
        <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

// Componente Skeleton para estadísticas
const SkeletonStats = () => (
  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 animate-pulse">
    <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Componente Skeleton para prácticas
const SkeletonPractices = () => (
  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 animate-pulse">
    <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-6 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-3 w-16 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

// Componente Skeleton para autorización
const SkeletonAuthorization = () => (
  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 animate-pulse">
    <div className="h-6 w-64 bg-gray-200 rounded mb-4"></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="h-4 w-20 bg-gray-200 rounded mx-auto mb-2"></div>
          <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2"></div>
          <div className="h-3 w-16 bg-gray-200 rounded mx-auto"></div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="h-4 w-20 bg-gray-200 rounded mx-auto mb-2"></div>
          <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2"></div>
          <div className="h-3 w-16 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  </div>
);
export function Dashboard() {
  const { 
    prescriptions, 
    doctors, 
    practices, 
    loadingPrescriptions, 
    loadingDoctors, 
    loadingPractices,
    loadPrescriptions,
    loadDoctors,
    loadPractices
  } = useData();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días atrás
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [selectedPractice, setSelectedPractice] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Usar todas las prescripciones (modo público)
  useEffect(() => {
    // Cargar datos necesarios para el dashboard
    loadPrescriptions();
    loadDoctors();
    loadPractices();
  }, []);

  const loading = loadingPrescriptions || loadingDoctors || loadingPractices;
  const basePrescriptions = prescriptions;

  // Filtrar prescripciones según los filtros aplicados
  const filteredPrescriptions = useMemo(() => {
    return basePrescriptions.filter(prescription => {
      const prescriptionDate = new Date(prescription.date);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      // Filtro por fecha
      if (prescriptionDate < startDate || prescriptionDate > endDate) {
        return false;
      }
      
      // Filtro por médico
      if (selectedDoctor !== 'all' && prescription.doctorId !== selectedDoctor) {
        return false;
      }
      
      // Filtro por tipo
      if (selectedType !== 'all' && prescription.type !== selectedType) {
        return false;
      }
      
      // Filtro por práctica
      if (selectedPractice !== 'all') {
        const hasPractice = prescription.items.some(item => item.practiceId === selectedPractice);
        if (!hasPractice) {
          return false;
        }
      }
      
      return true;
    });
  }, [basePrescriptions, dateRange, selectedDoctor, selectedPractice, selectedType]);

  // Estadísticas por día
  const dailyStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    
    filteredPrescriptions.forEach(prescription => {
      const date = prescription.date;
      stats[date] = (stats[date] || 0) + 1;
    });
    
    return Object.entries(stats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('es-AR'),
        count
      }));
  }, [filteredPrescriptions]);

  // Estadísticas por médico
  const doctorStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    
    filteredPrescriptions.forEach(prescription => {
      const doctorName = prescription.doctor.name;
      stats[doctorName] = (stats[doctorName] || 0) + 1;
    });
    
    return Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .map(([doctor, count]) => ({ doctor, count }));
  }, [filteredPrescriptions]);

  // Estadísticas por práctica
  const practiceStats = useMemo(() => {
    const stats: { [key: string]: { count: number; practice: any } } = {};
    
    filteredPrescriptions.forEach(prescription => {
      prescription.items.forEach(item => {
        const practiceId = item.practiceId;
        if (!stats[practiceId]) {
          stats[practiceId] = { count: 0, practice: item.practice };
        }
        stats[practiceId].count += 1;
      });
    });
    
    return Object.entries(stats)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([practiceId, { count, practice }]) => ({
        practiceId,
        practice: practice.name,
        category: practice.category,
        count
      }));
  }, [filteredPrescriptions]);

  // Estadísticas por tipo
  const typeStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    
    filteredPrescriptions.forEach(prescription => {
      stats[prescription.type] = (stats[prescription.type] || 0) + 1;
    });
    
    const typeLabels = {
      studies: 'Estudios',
      treatments: 'Tratamientos',
      authorization: 'Cirugías'
    };
    
    return Object.entries(stats).map(([type, count]) => ({
      type: typeLabels[type as keyof typeof typeLabels] || type,
      count
    }));
  }, [filteredPrescriptions]);

  // Estadísticas de autorización
  const authorizationStats = useMemo(() => {
    const authorized = filteredPrescriptions.filter(p => p.authorized).length;
    const pending = filteredPrescriptions.filter(p => !p.authorized).length;
    const total = filteredPrescriptions.length;
    
    return {
      authorized,
      pending,
      total,
      authorizedPercentage: total > 0 ? Math.round((authorized / total) * 100) : 0,
      pendingPercentage: total > 0 ? Math.round((pending / total) * 100) : 0
    };
  }, [filteredPrescriptions]);

  const resetFilters = () => {
    setDateRange({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
    setSelectedDoctor('all');
    setSelectedPractice('all');
    setSelectedType('all');
  };

  const exportData = () => {
    const reportData = {
      periodo: `${dateRange.startDate} a ${dateRange.endDate}`,
      totalRecetas: filteredPrescriptions.length,
      estadisticasPorDia: dailyStats,
      estadisticasPorMedico: doctorStats,
      estadisticasPorPractica: practiceStats,
      estadisticasPorPractica: practiceStats.map(stat => ({
        practice: stat.practice,
        category: stat.category,
        count: stat.count
      })),
      estadisticasPorTipo: typeStats
    };
    const handleAsync = async () => {
      try {
        await generateStatisticsReport(reportData);
      } catch (error) {
        console.error('Error exporting report:', error);
        alert('Error al generar el reporte PDF. Por favor, intente nuevamente.');
      }
    };
    
    handleAsync();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard de Estadísticas</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Análisis de recetas médicas
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              <Filter className="h-4 w-4" />
              Limpiar Filtros
            </button>
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={(startDate, endDate) => setDateRange({ startDate, endDate })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Médico
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los médicos</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="studies">Estudios</option>
              <option value="treatments">Tratamientos</option>
              <option value="authorization">Cirugías</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Práctica
            </label>
            <select
              value={selectedPractice}
              onChange={(e) => setSelectedPractice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas las prácticas</option>
              {practices.map(practice => (
                <option key={practice.id} value={practice.id}>{practice.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resumen General */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{filteredPrescriptions.length}</div>
                <div className="text-sm text-gray-600">Total Recetas</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{doctorStats.length}</div>
                <div className="text-sm text-gray-600">Médicos Activos</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{practiceStats.length}</div>
                <div className="text-sm text-gray-600">Prácticas Solicitadas</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {dailyStats.length > 0 ? Math.round(filteredPrescriptions.length / dailyStats.length) : 0}
                </div>
                <div className="text-sm text-gray-600">Promedio/Día</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado de Autorización */}
      {loading ? (
        <SkeletonAuthorization />
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Estado de Autorización de Recetas
          </h3>
          
          {filteredPrescriptions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay datos para mostrar</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Estadísticas numéricas */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">Autorizadas</span>
                  </div>
                  <div className="text-3xl font-bold text-green-700">{authorizationStats.authorized}</div>
                  <div className="text-sm text-green-600">{authorizationStats.authorizedPercentage}% del total</div>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Pendientes</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-700">{authorizationStats.pending}</div>
                  <div className="text-sm text-gray-600">{authorizationStats.pendingPercentage}% del total</div>
                </div>
              </div>
              
              {/* Gráfico circular */}
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    {/* Círculo de fondo */}
                    <path
                      className="text-gray-200"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Círculo de progreso */}
                    <path
                      className="text-green-500"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray={`${authorizationStats.authorizedPercentage}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{authorizationStats.authorizedPercentage}%</div>
                      <div className="text-xs text-gray-500">Autorizadas</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Resumen */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              {authorizationStats.pending === 0 && authorizationStats.authorized > 0 ? (
                <span className="font-medium">¡Excelente! Todas las recetas están autorizadas.</span>
              ) : authorizationStats.pending > 0 ? (
                <span>
                  <span className="font-medium">{authorizationStats.pending} recetas</span> pendientes de autorización
                  {authorizationStats.authorized > 0 && (
                    <span> y <span className="font-medium">{authorizationStats.authorized} recetas</span> ya autorizadas</span>
                  )}
                </span>
              ) : (
                <span>No hay recetas en el período seleccionado.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gráficos y Estadísticas */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonStats />
          <SkeletonStats />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recetas por Día */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Recetas por Día
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dailyStats.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay datos para mostrar</p>
              ) : (
                dailyStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{stat.date}</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="bg-blue-500 h-2 rounded"
                        style={{ 
                          width: `${Math.max(20, (stat.count / Math.max(...dailyStats.map(s => s.count))) * 100)}px` 
                        }}
                      ></div>
                      <span className="text-sm font-bold text-blue-600">{stat.count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recetas por Médico */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Recetas por Médico
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {doctorStats.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay datos para mostrar</p>
              ) : (
                doctorStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium truncate flex-1 mr-2">{stat.doctor}</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="bg-green-500 h-2 rounded"
                        style={{ 
                          width: `${Math.max(20, (stat.count / Math.max(...doctorStats.map(s => s.count))) * 100)}px` 
                        }}
                      ></div>
                      <span className="text-sm font-bold text-green-600">{stat.count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prácticas más Solicitadas */}
      {loading ? (
        <SkeletonPractices />
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Prácticas más Solicitadas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {practiceStats.length === 0 ? (
              <div className="col-span-full text-gray-500 text-center py-8">No hay datos para mostrar</div>
            ) : (
              practiceStats.slice(0, 12).map((stat, index) => {
                const categoryColors = {
                  study: 'bg-blue-100 text-blue-800 border-blue-200',
                  treatment: 'bg-green-100 text-green-800 border-green-200',
                  surgery: 'bg-purple-100 text-purple-800 border-purple-200'
                };
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 flex-1">{stat.practice}</h4>
                      <span className="text-lg font-bold text-purple-600 ml-2">{stat.count}</span>
                    </div>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs ${categoryColors[stat.category as keyof typeof categoryColors]}`}>
                      {stat.category === 'study' ? 'Estudio' : 
                       stat.category === 'treatment' ? 'Tratamiento' : 'Cirugía'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {practiceStats.length > 12 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Mostrando las 12 prácticas más solicitadas de {practiceStats.length} total
            </div>
          )}
        </div>
      )}

      {/* Distribución por Tipo */}
      {typeStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            Distribución por Tipo de Receta
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {typeStats.map((stat, index) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500'];
              const percentage = filteredPrescriptions.length > 0 
                ? Math.round((stat.count / filteredPrescriptions.length) * 100) 
                : 0;
              
              return (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`w-16 h-16 ${colors[index]} rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2`}>
                    {stat.count}
                  </div>
                  <div className="font-medium text-gray-900">{stat.type}</div>
                  <div className="text-sm text-gray-600">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}