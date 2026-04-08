package main

import (
	"sync"
	"time"
)

type CacheItem struct {
	Value      interface{}
	Expiration int64
}

type Cache struct {
	items map[string]CacheItem
	mu    sync.RWMutex
}

var globalCache *Cache

func InitCache() {
	globalCache = &Cache{
		items: make(map[string]CacheItem),
	}
	// Start cleanup routine
	go func() {
		for {
			time.Sleep(5 * time.Minute)
			globalCache.Cleanup()
		}
	}()
}

func GetCache() *Cache {
	if globalCache == nil {
		InitCache()
	}
	return globalCache
}

func (c *Cache) Set(key string, value interface{}, duration time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = CacheItem{
		Value:      value,
		Expiration: time.Now().Add(duration).UnixNano(),
	}
}

func (c *Cache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, found := c.items[key]
	if !found {
		return nil, false
	}

	if time.Now().UnixNano() > item.Expiration {
		return nil, false
	}

	return item.Value, true
}

func (c *Cache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.items, key)
}

func (c *Cache) Cleanup() {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now().UnixNano()
	for key, item := range c.items {
		if now > item.Expiration {
			delete(c.items, key)
		}
	}
}
