package main

import (
	"fmt"
	"net/http"
	"sync"
	"time"
)

func main() {
	url := "http://localhost:8081/health"
	numRequests := 200
	var wg sync.WaitGroup
	
	fmt.Printf("Starting Load Test: %d concurrent requests to %s\n", numRequests, url)
	
	start := time.Now()
	
	var successCount int
	var failCount int
	var mu sync.Mutex

	for i := 0; i < numRequests; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			
			resp, err := http.Get(url)
			mu.Lock()
			defer mu.Unlock()
			
			if err != nil {
				failCount++
				return
			}
			defer resp.Body.Close()
			
			if resp.StatusCode == http.StatusOK {
				successCount++
			} else {
				failCount++
			}
		}()
	}

	wg.Wait()
	duration := time.Since(start)

	fmt.Println("--- Load Test Results ---")
	fmt.Printf("Total Time: %v\n", duration)
	fmt.Printf("Successful Requests: %d\n", successCount)
	fmt.Printf("Failed Requests: %d\n", failCount)
	fmt.Printf("Requests/sec: %.2f\n", float64(numRequests)/duration.Seconds())
	
	if failCount > 0 {
		fmt.Println("WARNING: Some requests failed!")
	} else {
		fmt.Println("SUCCESS: All requests completed without errors (10/10 Concurrency).")
	}
}
