import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const FloatingContainer = styled(motion.div)`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 350px;
  max-height: 450px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  overflow: hidden;
  border: 1px solid #e1e5e9;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #2c5530 0%, #4a7c59 100%);
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const Content = styled.div`
  padding: 20px;
`;

const ResultSummary = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border-left: 4px solid #2c5530;
`;

const ResultCount = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #2c5530;
  margin-bottom: 4px;
`;

const ResultDescription = styled.div`
  font-size: 14px;
  color: #6c757d;
`;

const ActiveFilters = styled.div`
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const FilterTag = styled.span`
  background: #e3f2fd;
  color: #1565c0;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
`;

const FarmersList = styled.div`
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 6px;
`;

const FarmerItem = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
  cursor: pointer;

  &:hover {
    background: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const FarmerName = styled.div`
  font-weight: 600;
  color: #2c5530;
  font-size: 14px;
  margin-bottom: 4px;
`;

const FarmerDetails = styled.div`
  font-size: 12px;
  color: #6c757d;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const DetailItem = styled.span`
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  font-size: 14px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 3px;
  background: #e9ecef;
  margin-top: 16px;
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #2c5530, #4a7c59);
  width: ${({ percentage }) => percentage}%;
  transition: width 0.3s ease;
`;

const FloatingResults = ({ 
  visible, 
  filteredFarmers = [], 
  onHide, 
  totalCount = 0, 
  filteredCount = 0,
  activeFilters = {} // New prop to show active filters
}) => {
  const [autoHideTimer, setAutoHideTimer] = useState(null);

  // Auto-hide after 12 seconds (increased for better UX)
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide && onHide();
      }, 12000);
      setAutoHideTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [visible, onHide]);

  // Clear timer when manually closing
  const handleClose = () => {
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }
    onHide && onHide();
  };

  const getResultText = () => {
    if (filteredCount === 0) {
      return "No farmers found";
    } else if (filteredCount === totalCount) {
      return "All farmers shown";
    } else {
      return `${filteredCount} of ${totalCount} farmers`;
    }
  };

  const getFilteredFarmersDisplay = () => {
    return filteredFarmers.slice(0, 10); // Show max 10 farmers
  };

  const getActiveFilters = () => {
    if (!activeFilters) return [];
    
    const filters = [];
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== 'All') {
        let displayName = key;
        switch (key) {
          case 'project_code':
            displayName = 'Project';
            break;
          case 'blocks':
            displayName = 'Block';
            break;
          case 'grampanchayat':
            displayName = 'GP';
            break;
          default:
            displayName = key.charAt(0).toUpperCase() + key.slice(1);
        }
        filters.push({ name: displayName, value });
      }
    });
    return filters;
  };

  const percentage = totalCount > 0 ? (filteredCount / totalCount) * 100 : 0;
  const activeFiltersList = getActiveFilters();

  return (
    <AnimatePresence>
      {visible && (
        <FloatingContainer
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
        >
          <Header>
            <Title>Filter Results</Title>
            <CloseButton onClick={handleClose}>
              ×
            </CloseButton>
          </Header>

          <Content>
            <ResultSummary>
              <ResultCount>{getResultText()}</ResultCount>
              <ResultDescription>
                {filteredCount > 0 ? 'Matching your current filters' : 'Try adjusting your filters'}
              </ResultDescription>
              
              {activeFiltersList.length > 0 && (
                <ActiveFilters>
                  {activeFiltersList.map((filter, index) => (
                    <FilterTag key={index}>
                      {filter.name}: {filter.value}
                    </FilterTag>
                  ))}
                </ActiveFilters>
              )}
              
              <ProgressBar>
                <ProgressFill percentage={percentage} />
              </ProgressBar>
            </ResultSummary>

            {filteredCount > 0 ? (
              <FarmersList>
                {getFilteredFarmersDisplay().map((farmer, index) => (
                  <FarmerItem key={farmer.id || index}>
                    <FarmerName>
                      {farmer.farmer_name || farmer.name || 'Unknown Farmer'}
                    </FarmerName>
                    <FarmerDetails>
                      {farmer.project_code && (
                        <DetailItem>Project: {farmer.project_code}</DetailItem>
                      )}
                      {farmer.state && (
                        <DetailItem>{farmer.state}</DetailItem>
                      )}
                      {farmer.district && (
                        <DetailItem>{farmer.district}</DetailItem>
                      )}
                      {farmer.blocks && (
                        <DetailItem>{farmer.blocks}</DetailItem>
                      )}
                      {farmer.grampanchayat && (
                        <DetailItem>GP: {farmer.grampanchayat}</DetailItem>
                      )}
                      {farmer.village && (
                        <DetailItem>{farmer.village}</DetailItem>
                      )}
                      {farmer.crop && (
                        <DetailItem>Crop: {farmer.crop}</DetailItem>
                      )}
                      {farmer.area_sq_meters && (
                        <DetailItem>{farmer.area_sq_meters} sq m</DetailItem>
                      )}
                      {farmer.area_acres && (
                        <DetailItem>{farmer.area_acres} acres</DetailItem>
                      )}
                    </FarmerDetails>
                  </FarmerItem>
                ))}
                {filteredCount > 10 && (
                  <FarmerItem style={{ 
                    textAlign: 'center', 
                    fontStyle: 'italic',
                    background: '#f8f9fa',
                    color: '#6c757d'
                  }}>
                    And {filteredCount - 10} more farmers...
                  </FarmerItem>
                )}
              </FarmersList>
            ) : (
              <EmptyState>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                <div>No farmers match your current filters.</div>
                <div style={{ fontSize: '12px', marginTop: '8px' }}>
                  Try clearing some filters to see more results.
                </div>
                {activeFiltersList.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '11px', marginBottom: '4px' }}>Active filters:</div>
                    <ActiveFilters style={{ justifyContent: 'center' }}>
                      {activeFiltersList.map((filter, index) => (
                        <FilterTag key={index}>
                          {filter.name}: {filter.value}
                        </FilterTag>
                      ))}
                    </ActiveFilters>
                  </div>
                )}
              </EmptyState>
            )}
          </Content>
        </FloatingContainer>
      )}
    </AnimatePresence>
  );
};

export default FloatingResults;