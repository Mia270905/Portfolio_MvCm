// hooks/useComandaPDF.ts
import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';

export const useComandaPDF = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async (OrderComandaPDF: any, order: any) => {
    setIsGenerating(true);
    try {
      const blob = await pdf(<OrderComandaPDF order={order} />).toBlob();
      return blob;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const previewPDF = async (OrderComandaPDF: any, order: any) => {
    try {
      const blob = await generatePDF(OrderComandaPDF, order);
      const url = URL.createObjectURL(blob);
      
      // Abrir en nueva pestaña
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        throw new Error('Por favor permite ventanas emergentes para la vista previa');
      }
      
      // Limpiar URL después de un tiempo
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      throw error;
    }
  };

  const printPDF = async (OrderComandaPDF: any, order: any) => {
    try {
      const blob = await generatePDF(OrderComandaPDF, order);
      const url = URL.createObjectURL(blob);
      
      // Crear iframe para impresión
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      return new Promise((resolve, reject) => {
        iframe.onload = () => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            
            // Limpiar después de imprimir
            setTimeout(() => {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(url);
              resolve(true);
            }, 1000);
          } catch (error) {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
            reject(error);
          }
        };
        
        iframe.src = url;
      });
    } catch (error) {
      throw error;
    }
  };

  const downloadPDF = async (OrderComandaPDF: any, order: any, filename?: string) => {
    try {
      const blob = await generatePDF(OrderComandaPDF, order);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename || `orden-${order.order_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      throw error;
    }
  };

  return {
    isGenerating,
    previewPDF,
    printPDF,
    downloadPDF,
  };
};